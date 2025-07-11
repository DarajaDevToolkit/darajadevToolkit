from setuptools import setup, find_packages

setup(
	name='daraja-cli',
	version='0.1.0',
	packages=find_packages(where='src'),
	package_dir={'': 'src'},
	install_requires=[
		'click>=8.2.1',
		'rich>=14.0.0',
		'requests>=2.32.4',
		'keyring>=23.0.1'
	],
	entry_points={
		'console_scripts': [
			'daraja=daraja_cli.main:cli'
		]
	}
)
